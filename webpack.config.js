const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
    entry: "./src/index.js",
    devServer: {
        static: {
          directory: path.join(__dirname, 'public'),
        },
        hot: true,
        compress: true,
        port: 9000,
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "auto"
    },
    experiments:{
        asyncWebAssembly: true,
        topLevelAwait: true
    },
    plugins:[
        new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')  }),
        new HtmlWebpackPlugin({ template: "./public/index.html" }), 
        new MiniCssExtractPlugin,
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, './src/assets'),
                    to: path.resolve(__dirname, 'dist/assets')
                },
                // {
                //     from: path.resolve(__dirname, './wasm/*.wasm'),
                //     to: path.resolve(__dirname, 'dist')
                // },
                {
                    from: path.resolve(__dirname, './wasm/*.js'),
                    to: path.resolve(__dirname, 'dist')
                }
            ]
        }),
    ],
    module: {
        rules:[{
            test: /\.scss$/,
            use: [
                MiniCssExtractPlugin.loader,
                "css-loader",
                "sass-loader"
            ]
            },
            {
                test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
                type: "asset/resource"
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin
        ]
    }
}