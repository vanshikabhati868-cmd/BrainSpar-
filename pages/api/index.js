// Sample content of index.js
// This file is generated from index.jd

const handler = (req, res) => {
    res.status(200).json({ message: 'Hello from API' });
};

export default handler;