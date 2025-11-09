const express = require('express');
const {
  criarMeta,
  listarMetas,
  obterMetaPeriodo,
  atualizarMeta,
  removerMeta
} = require('../controllers/metaController');

const router = express.Router();

router.post('/', criarMeta);
router.get('/', listarMetas);
router.get('/:mes/:ano', obterMetaPeriodo);
router.put('/:id', atualizarMeta);
router.delete('/:id', removerMeta);

module.exports = router;

