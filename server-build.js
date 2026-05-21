const express = require('express');
const path = require('path');
const app = express();

// Serve ./public at /myapp
app.use('/myapp', express.static(path.join(__dirname, 'build')));
// app.use(
//   '/myapp',
//   express.static(path.join(__dirname, 'build'), {
//     maxAge: '1y',
//     immutable: true,
//   })
// );

app.listen(9090, () => console.log('Server running on port 9090'));
