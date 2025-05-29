const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/home.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/login.html'));
});

router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/register.html'));
});

router.get('/registerGoogle', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/RegisterGoogle.html'));
});

router.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/terms.html'));
});

router.get('/FinishRegister', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/FinishRegister.html'));
});

router.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/recovery_password.html'));
});

router.get('/Arrendador', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/arrendador.html'));
});

router.get('/Arrendatario', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/arrendatario.html'));
});

router.get('/Administrador', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/admin.html'));
});

module.exports = router;