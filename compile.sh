em++ -s SINGLE_FILE=1 -O2 ./wasm/src/main.cpp -o ./wasm/main.js -s ENVIRONMENT='web' --bind ;
echo "export default Module;" >> ./wasm/main.js;
