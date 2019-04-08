const path = require('path');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

const isProductionMode = process.env.NODE_ENV === 'production';

const chartEntry = isProductionMode ? 'chart.min' : 'chart.banana';
const exampleEntry = isProductionMode ? 'example.min' : 'example';
const classNames = isProductionMode ? '__chart-lib__[hash:base64:5]' : '[name]__[local]';

module.exports = {
    mode: isProductionMode ? 'production' : 'development',
    entry: {
        [chartEntry]: './src/chart/index.js',
        [exampleEntry]: './src/example/example.js',
    },
    externals: {
        window: 'window',
    },
    output: {
        path: path.join(__dirname, 'lib'),
        filename: '[name].js',
    },
    module: {
        rules: [
            // {
            //     test: /\.js$/,
            //     exclude: /(node_modules)/,
            //     use: {
            //         loader: 'babel-loader',
            //         options: {
            //             presets: ['@babel/preset-env'],
            //         },
            //     },
            // },

            {
                test: /\.glsl$/i,
                use: 'raw-loader',
            },
            {
                test: /\.styl$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                modules: true,
                                localIdentName: classNames,
                            },
                        },
                        {
                            loader: 'stylus-loader',
                        },
                    ],
                }),
            },
            {
                test: /\.(jpe?g|png|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                use: 'base64-inline-loader?limit=1000&name=[name].[ext]',
            },
        ],
    },
    plugins: [
        new ExtractTextPlugin('[name].css'),
    ],
    devtool: isProductionMode ? 'none' : 'cheap-eval-source-map',
};
