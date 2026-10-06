import { Response } from 'express';
import { Customer } from '../models/Customer.ts';
import { AuthRequest } from '../middleware/auth.ts';

export async function getCustomers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { search, sortBy, sortOrder } = req.query;

    const filter: any = { userId };

    if (search && typeof search === 'string' && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { panNumber: { $regex: search.trim(), $options: 'i' } },
        { municipality: { $regex: search.trim(), $options: 'i' } },
        { tole: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const sortField = (sortBy as string) || 'name';
    const order = sortOrder === 'desc' ? -1 : 1;

    const customers = await Customer.find(filter).sort({ [sortField]: order });
    res.json({ customers });
  } catch (error: any) {
    console.error('getCustomers error:', error);
    res.status(500).json({ error: 'Unable to retrieve customer list.' });
  }
}

export async function getCustomerById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const customer = await Customer.findOne({ _id: id, userId });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    res.json({ customer });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to fetch customer details.' });
  }
}

export async function createCustomer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const {
      name,
      phone,
      email,
      panNumber,
      address,
      province,
      district,
      municipality,
      wardNo,
      tole,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Customer name is required.' });
      return;
    }

    const customer = await Customer.create({
      userId,
      name: name.trim(),
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      panNumber: panNumber?.trim() || '',
      address: address?.trim() || '',
      province: province?.trim() || 'Bagmati Province',
      district: district?.trim() || 'Kathmandu',
      municipality: municipality?.trim() || '',
      wardNo: wardNo?.trim() || '',
      tole: tole?.trim() || '',
      notes: notes?.trim() || '',
    });

    res.status(201).json({
      message: 'Customer added successfully.',
      customer,
    });
  } catch (error: any) {
    console.error('createCustomer error:', error);
    res.status(500).json({ error: 'Unable to create customer.' });
  }
}

export async function updateCustomer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      name,
      phone,
      email,
      panNumber,
      address,
      province,
      district,
      municipality,
      wardNo,
      tole,
      notes,
    } = req.body;

    const customer = await Customer.findOne({ _id: id, userId });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    if (name) customer.name = name.trim();
    if (phone !== undefined) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email.trim();
    if (panNumber !== undefined) customer.panNumber = panNumber.trim();
    if (address !== undefined) customer.address = address.trim();
    if (province !== undefined) customer.province = province.trim();
    if (district !== undefined) customer.district = district.trim();
    if (municipality !== undefined) customer.municipality = municipality.trim();
    if (wardNo !== undefined) customer.wardNo = wardNo.trim();
    if (tole !== undefined) customer.tole = tole.trim();
    if (notes !== undefined) customer.notes = notes.trim();

    await customer.save();

    res.json({
      message: 'Customer updated successfully.',
      customer,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to update customer.' });
  }
}

export async function deleteCustomer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const customer = await Customer.findOneAndDelete({ _id: id, userId });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    res.json({ message: 'Customer removed.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to delete customer.' });
  }
}
