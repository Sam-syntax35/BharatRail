const { Router } = require('express');
const ctrl = require('../controllers/search.controller');
const router = Router();

router.get('/trains', ctrl.searchTrains);
router.get('/autocomplete', ctrl.autocomplete);
router.get('/debug/stations', ctrl.debugStations);
router.get('/debug/trains', ctrl.debugTrains);

module.exports = router;