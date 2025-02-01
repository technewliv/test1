const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Listar todos os corretores
router.get('/', asyncHandler(async (req, res) => {
  const corretores = await User.find({ role: 'corretor' })
    .select('id nome email')
    .sort({ nome: 1 });
  res.json(corretores);
}));

// Buscar corretor por ID
router.get('/:id', asyncHandler(async (req, res) => {
  const corretor = await User.findOne({ 
    _id: req.params.id,
    role: 'corretor'
  }).select('id nome email');

  if (!corretor) {
    res.status(404).json({ message: 'Corretor não encontrado' });
    return;
  }

  res.json(corretor);
}));

module.exports = router; 