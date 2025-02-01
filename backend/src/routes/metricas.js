const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');

router.get('/', asyncHandler(async (req, res) => {
  // Total de Leads
  const totalLeads = await Lead.countDocuments();

  // Leads Distribuídos Hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const leadsDistribuidosHoje = await Lead.countDocuments({
    dataDistribuicao: { $gte: hoje }
  });

  // Leads Devolvidos
  const leadsDevolvidos = await Lead.countDocuments({
    status: 'devolvido'
  });

  // Leads em Atendimento
  const leadsEmAtendimento = await Lead.countDocuments({
    status: 'em_atendimento'
  });

  res.json({
    totalLeads,
    leadsDistribuidosHoje,
    leadsDevolvidos,
    leadsEmAtendimento
  });
}));

module.exports = router; 