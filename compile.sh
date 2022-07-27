em++ -s SINGLE_FILE=1 -O3 ./wasm/src/main.cpp -o ./wasm/main.js -s ENVIRONMENT='web' --bind -s ASSERTIONS -s ALLOW_MEMORY_GROWTH -s USE_SDL=2 -s ASYNCIFY;
echo "export default Module;" >> ./wasm/main.js;
