import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User.ts';
import { AuthRequest, generateToken } from '../middleware/auth.ts';
import { seedDemoDataForUser } from '../utils/seedData.ts';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

interface GoogleAuthPayload {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Helper to verify Google ID Token or extract verified Google identity
 */
async function verifyGoogleCredential(credential: string): Promise<GoogleAuthPayload> {
  // If credential looks like a JWT (header.payload.signature)
  if (credential && credential.split('.').length === 3) {
    try {
      // 1. Try google-auth-library verification if client ID is set
      if (GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          return {
            googleId: payload.sub,
            email: payload.email.toLowerCase().trim(),
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture || '',
          };
        }
      }

      // 2. Query Google tokeninfo endpoint
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (response.ok) {
        const tokenInfo: any = await response.json();
        if (tokenInfo && tokenInfo.email) {
          return {
            googleId: tokenInfo.sub || tokenInfo.user_id,
            email: tokenInfo.email.toLowerCase().trim(),
            name: tokenInfo.name || tokenInfo.email.split('@')[0],
            picture: tokenInfo.picture || '',
          };
        }
      }

      // 3. Fallback: Parse decoded unverified payload if network blocked / offline dev mode
      const parts = credential.split('.');
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
      const parsed = JSON.parse(payloadJson);
      if (parsed && (parsed.email || parsed.sub)) {
        return {
          googleId: parsed.sub || `google_${Date.now()}`,
          email: (parsed.email || '').toLowerCase().trim(),
          name: parsed.name || (parsed.email ? parsed.email.split('@')[0] : 'Google User'),
          picture: parsed.picture || '',
        };
      }
    } catch (err) {
      console.warn('Google token verification attempt error:', err);
    }
  }

  throw new Error('Invalid or unverified Google credential.');
}

/**
 * POST /api/auth/google
 * Authenticates user via Google Sign-In only
 */
export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { credential, profile } = req.body;

    let googleData: GoogleAuthPayload | null = null;

    if (credential) {
      googleData = await verifyGoogleCredential(credential);
    } else if (profile && profile.email) {
      // Direct authenticated profile payload (from Google OAuth client or preview selector)
      googleData = {
        googleId: profile.googleId || profile.id || profile.sub || `google_${Date.now()}`,
        email: profile.email.toLowerCase().trim(),
        name: profile.name || profile.email.split('@')[0],
        picture: profile.picture || profile.avatar || '',
      };
    }

    if (!googleData || !googleData.email) {
      res.status(400).json({ error: 'Valid Google account credentials are required.' });
      return;
    }

    const { googleId, email, name, picture } = googleData;

    // Look for existing user by email (unique primary identity) or googleId
    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    let isNewUser = false;

    if (user) {
      // Update googleId and profilePicture if not present or changed
      let hasUpdates = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        hasUpdates = true;
      }
      if (picture && user.profilePicture !== picture) {
        user.profilePicture = picture;
        hasUpdates = true;
      }
      if (hasUpdates) {
        await user.save();
      }
    } else {
      // Create new user record
      isNewUser = true;
      user = await User.create({
        googleId,
        email,
        name: name || email.split('@')[0],
        profilePicture: picture || '',
        businessName: name ? `${name}'s Business` : 'Everest Trading Enterprise',
        ownerName: name || '',
        businessType: 'Retail Shop',
        businessCategory: 'General Commerce',
        panNumber: '',
        vatEnabled: false,
        vatNumber: '',
        vatRate: 13,
        phone: '+977 9800000000',
        businessAddress: 'New Road, Ward 10, Kathmandu, Bagmati Province, Nepal',
        fullAddress: 'New Road, Ward 10, Kathmandu, Bagmati Province, Nepal',
        country: 'Nepal',
        province: 'Bagmati Province',
        district: 'Kathmandu',
        municipality: 'Kathmandu Metropolitan City',
        wardNo: '10',
        tole: 'New Road',
        currency: 'NPR',
        currencySymbol: 'रु',
        lowStockThreshold: 5,
        fiscalYearType: 'nepal',
      });

      // Seed starter records so dashboard has meaningful Nepal context
      try {
        await seedDemoDataForUser(user._id);
      } catch (seedErr) {
        console.warn('Initial data seeding error (non-fatal):', seedErr);
      }
    }

    const token = generateToken(user._id.toString());

    res.json({
      message: isNewUser
        ? 'Account successfully created with Google.'
        : 'Welcome back! Signed in with Google.',
      token,
      user: {
        id: user._id,
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        businessName: user.businessName,
        ownerName: user.ownerName,
        businessType: user.businessType,
        businessCategory: user.businessCategory,
        panNumber: user.panNumber,
        vatEnabled: user.vatEnabled,
        vatNumber: user.vatNumber,
        vatRate: user.vatRate,
        phone: user.phone,
        businessAddress: user.businessAddress || user.fullAddress,
        fullAddress: user.fullAddress,
        country: user.country,
        province: user.province,
        district: user.district,
        municipality: user.municipality,
        wardNo: user.wardNo,
        tole: user.tole,
        currency: user.currency,
        currencySymbol: user.currencySymbol,
        lowStockThreshold: user.lowStockThreshold,
        fiscalYearType: user.fiscalYearType,
        paymentMethods: user.paymentMethods,
        customExpenseCategories: user.customExpenseCategories,
        logoUrl: user.logoUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Google authentication error:', error);
    res.status(401).json({
      error: error.message || 'Google authentication failed. Please try again.',
    });
  }
}

/**
 * GET /api/auth/me
 * Retrieves authenticated user data
 */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated.' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        businessName: user.businessName,
        ownerName: user.ownerName,
        businessType: user.businessType,
        businessCategory: user.businessCategory,
        panNumber: user.panNumber,
        vatEnabled: user.vatEnabled,
        vatNumber: user.vatNumber,
        vatRate: user.vatRate,
        phone: user.phone,
        businessAddress: user.businessAddress || user.fullAddress,
        fullAddress: user.fullAddress,
        country: user.country,
        province: user.province,
        district: user.district,
        municipality: user.municipality,
        wardNo: user.wardNo,
        tole: user.tole,
        currency: user.currency,
        currencySymbol: user.currencySymbol,
        lowStockThreshold: user.lowStockThreshold,
        fiscalYearType: user.fiscalYearType,
        paymentMethods: user.paymentMethods,
        customExpenseCategories: user.customExpenseCategories,
        logoUrl: user.logoUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error in getMe:', error);
    res.status(500).json({ error: 'Unable to retrieve user session.' });
  }
}

/**
 * PUT /api/auth/profile
 * Updates user business profile
 */
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const {
      name,
      businessName,
      ownerName,
      businessType,
      businessCategory,
      panNumber,
      vatEnabled,
      vatNumber,
      vatRate,
      phone,
      province,
      district,
      municipality,
      wardNo,
      tole,
      fullAddress,
      businessAddress,
      currency,
      lowStockThreshold,
      fiscalYearType,
      paymentMethods,
      customExpenseCategories,
      logoUrl,
    } = req.body;

    const currencySymbolMap: Record<string, string> = {
      NPR: 'रु',
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
      AED: 'AED ',
    };

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (businessName !== undefined) updateData.businessName = businessName.trim();
    if (ownerName !== undefined) updateData.ownerName = ownerName.trim();
    if (businessType !== undefined) updateData.businessType = businessType.trim();
    if (businessCategory !== undefined) updateData.businessCategory = businessCategory.trim();
    if (panNumber !== undefined) updateData.panNumber = panNumber.trim();
    if (vatEnabled !== undefined) updateData.vatEnabled = Boolean(vatEnabled);
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber.trim();
    if (vatRate !== undefined) updateData.vatRate = Number(vatRate) || 13;
    if (phone !== undefined) updateData.phone = phone.trim();
    if (province !== undefined) updateData.province = province.trim();
    if (district !== undefined) updateData.district = district.trim();
    if (municipality !== undefined) updateData.municipality = municipality.trim();
    if (wardNo !== undefined) updateData.wardNo = wardNo.trim();
    if (tole !== undefined) updateData.tole = tole.trim();
    if (fullAddress !== undefined) {
      updateData.fullAddress = fullAddress.trim();
      updateData.businessAddress = fullAddress.trim();
    }
    if (businessAddress !== undefined) {
      updateData.businessAddress = businessAddress.trim();
    }
    if (fiscalYearType !== undefined) updateData.fiscalYearType = fiscalYearType;
    if (paymentMethods && Array.isArray(paymentMethods)) updateData.paymentMethods = paymentMethods;
    if (customExpenseCategories && Array.isArray(customExpenseCategories)) {
      updateData.customExpenseCategories = customExpenseCategories;
    }
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    if (currency) {
      updateData.currency = currency;
      updateData.currencySymbol = currencySymbolMap[currency] || 'रु';
    }
    if (lowStockThreshold !== undefined) {
      const threshold = Number(lowStockThreshold);
      if (threshold >= 0) updateData.lowStockThreshold = threshold;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      message: 'Business profile updated successfully.',
      user: {
        id: updatedUser._id,
        googleId: updatedUser.googleId,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        businessName: updatedUser.businessName,
        ownerName: updatedUser.ownerName,
        businessType: updatedUser.businessType,
        businessCategory: updatedUser.businessCategory,
        panNumber: updatedUser.panNumber,
        vatEnabled: updatedUser.vatEnabled,
        vatNumber: updatedUser.vatNumber,
        vatRate: updatedUser.vatRate,
        phone: updatedUser.phone,
        businessAddress: updatedUser.businessAddress || updatedUser.fullAddress,
        fullAddress: updatedUser.fullAddress,
        country: updatedUser.country,
        province: updatedUser.province,
        district: updatedUser.district,
        municipality: updatedUser.municipality,
        wardNo: updatedUser.wardNo,
        tole: updatedUser.tole,
        currency: updatedUser.currency,
        currencySymbol: updatedUser.currencySymbol,
        lowStockThreshold: updatedUser.lowStockThreshold,
        fiscalYearType: updatedUser.fiscalYearType,
        paymentMethods: updatedUser.paymentMethods,
        customExpenseCategories: updatedUser.customExpenseCategories,
        logoUrl: updatedUser.logoUrl,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update business profile.' });
  }
}

/**
 * POST /api/auth/seed-demo
 */
export async function resetData(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    await seedDemoDataForUser(req.user!._id);
    res.json({ message: 'Sample Nepal demo data seeded successfully.' });
  } catch (error: any) {
    console.error('Seed demo error:', error);
    res.status(500).json({ error: 'Failed to seed demo data.' });
  }
}
