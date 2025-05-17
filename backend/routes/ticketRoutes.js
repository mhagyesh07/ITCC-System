const express = require('express');
const Ticket = require('../models/Ticket');
const router = express.Router();

// Create a new ticket
router.post('/', async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const { limit, sort } = req.query;
    const query = Ticket.find().populate('employeeId');

    if (sort) {
      query.sort(sort);
    }

    if (limit) {
      query.limit(parseInt(limit));
    }

    const tickets = await query;
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update admin comment for a specific ticket
router.put('/:id/comment', async (req, res) => {
  try {
    const { adminComment } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { adminComment },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ message: 'Admin comment updated successfully', ticket });
  } catch (error) {
    console.error('Error updating admin comment:', error);
    res.status(500).json({ error: 'Failed to update admin comment' });
  }
});

// Get a specific ticket by ID
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('employeeId');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Rename `dept` to `department` in the employeeId object
    if (ticket.employeeId) {
      ticket.employeeId = {
        ...ticket.employeeId.toObject(),
        department: ticket.employeeId.dept,
      };
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Close a specific ticket by ID
router.put('/:id/close', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: 'Closed' },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ message: 'Ticket closed successfully', ticket });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ error: 'Failed to close ticket' });
  }
});

module.exports = router;