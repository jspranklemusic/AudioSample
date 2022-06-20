const path = require('path');

module.exports = {
    entry: {
        main: path.resolve(__dirname, './src/index.js')
    },
    output: {
        main: path.resolve(__dirname, './dist'),
        filename: '[name].bundle.js'
    }
}