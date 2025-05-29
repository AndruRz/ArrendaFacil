const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const animationStatesFile = path.join(__dirname, '../data/animationStates.json');
const dataDir = path.join(__dirname, '../data');

// Asegurarse de que el directorio y el archivo existan
async function ensureFileExists() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(animationStatesFile, fs.constants.R_OK | fs.constants.W_OK);
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        await fs.writeFile(animationStatesFile, JSON.stringify({}, null, 2));
      } catch (writeError) {
        throw writeError;
      }
    } else {
      console.error('Error en ensureFileExists:', error);
      throw error;
    }
  }
}

// Obtener estado de animación
router.get('/animation-state/:email', async (req, res) => {
  try {
    await ensureFileExists();
    const data = await fs.readFile(animationStatesFile, 'utf8');
    const states = JSON.parse(data || '{}');
    const hasSeen = states[req.params.email] || false;
    res.json({ success: true, hasSeen });
  } catch (error) {

    res.status(500).json({ success: false, message: 'Error al leer el estado de la animación' });
  }
});

// Actualizar estado de animación
router.post('/animation-state/:email', async (req, res) => {
  try {
    await ensureFileExists();
    const data = await fs.readFile(animationStatesFile, 'utf8');
    const states = JSON.parse(data || '{}');
    states[req.params.email] = true;
    await fs.writeFile(animationStatesFile, JSON.stringify(states, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al guardar el estado de la animación' });
  }
});

module.exports = router;