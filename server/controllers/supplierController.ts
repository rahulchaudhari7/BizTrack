import { Response } from 'express';
import { Supplier } from '../models/Supplier.ts';
import { AuthRequest } from '../middleware/auth.ts';

export async function getSuppliers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { search, sortBy, sortOrder } = req.query;

    const filter: any = { userId };

    if (search && typeof search === 'string' && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { contactPerson: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { panNumber: { $regex: search.trim(), $options: 'i' } },
        { district: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const sortField = (sortBy as string) || 'name';
    const order = sortOrder === 'desc' ? -1 : 1;

    const suppliers = await Supplier.find(filter).sort({ [sortField]: order });
    res.json({ suppliers });
  } catch (error: any) {
    console.error('getSuppliers error:', error);
    res.status(500).json({ error: 'Unable to retrieve suppliers.' });
  }
}

export async function getSupplierById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const supplier = await Supplier.findOne({ _id: id, userId });
    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found.' });
      return;
    }

    res.json({ supplier });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch supplier details.' });
  }
}

export async function createSupplier(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const {
      name,
      contactPerson,
      phone,
      email,
      panNumber,
      address,
      province,
      district,
      municipality,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Supplier name is required.' });
      return;
    }

    const supplier = await Supplier.create({
      userId,
      name: name.trim(),
      contactPerson: contactPerson?.trim() || '',
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      panNumber: panNumber?.trim() || '',
      address: address?.trim() || '',
      province: province?.trim() || 'Bagmati Province',
      district: district?.trim() || 'Kathmandu',
      municipality: municipality?.trim() || '',
      notes: notes?.trim() || '',
    });

    res.status(201).json({
      message: 'Supplier added successfully.',
      supplier,
    });
  } catch (error: any) {
    console.error('createSupplier error:', error);
    res.status(500).json({ error: 'Unable to create supplier.' });
  }
}

export async function updateSupplier(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      name,
      contactPerson,
      phone,
      email,
      panNumber,
      address,
      province,
      district,
      municipality,
      notes,
    } = req.body;

    const supplier = await Supplier.findOne({ _id: id, userId });
    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found.' });
      return;
    }

    if (name) supplier.name = name.trim();
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson.trim();
    if (phone !== undefined) supplier.phone = phone.trim();
    if (email !== undefined) supplier.email = email.trim();
    if (panNumber !== undefined) supplier.panNumber = panNumber.trim();
    if (address !== undefined) supplier.address = address.trim();
    if (province !== undefined) supplier.province = province.trim();
    if (district !== undefined) supplier.district = district.trim();
    if (municipality !== undefined) supplier.municipality = municipality.trim();
    if (notes !== undefined) supplier.notes = notes.trim();

    await supplier.save();

    res.json({
      message: 'Supplier updated successfully.',
      supplier,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to update supplier.' });
  }
}

export async function deleteSupplier(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const supplier = await Supplier.findOneAndDelete({ _id: id, userId });
    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found.' });
      return;
    }

    res.json({ message: 'Supplier removed.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to delete supplier.' });
  }
}
