em++ -s SINGLE_FILE=1 -O2 ./wasm/src/main.cpp -o ./wasm/main.js -s ENVIRONMENT='web' --bind -s ASSERTIONS -s ALLOW_MEMORY_GROWTH;
echo "export default Module;" >> ./wasm/main.js;
