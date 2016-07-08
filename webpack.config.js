var webpack = require('webpack');

module.exports = {
    context: __dirname + '/static/js',
    entry: {
        bundle: './index.js'
    },
    externals: [ {
        angular: true
    } ],
    module: {
        loaders: [
            {
                test: /.js$/,
                exclude: /node_modules/,
                loaders: ['ng-annotate']
            },
        ]
    },
    output: {
        path: __dirname + '/static/js',
        filename: '[name].js'
    },
    devtool: 'source-map'
};

