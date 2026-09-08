function errorHandler(err, req, res, next) {
    console.error(err.stack);
    
    if (req.path.startsWith('/api/')) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    
    res.status(500).send('Something broke! Internal Server Error.');
}

module.exports = errorHandler;
