var path = require('path');

module.exports = {
	entry: './chess-run.js',
	devtool: 'source-map',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'chess-bundle.js'
	},
	module: {
		rules: [
			{ test: /\.ts$/, loader: 'ts-loader', exclude: '/node_modules/' }
		]
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
};
