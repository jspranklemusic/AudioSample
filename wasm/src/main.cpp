#include <string>
#include <iostream>
#include <emscripten.h>
#include <emscripten/val.h>
#include <emscripten/bind.h>
#include <vector>
#include <chrono>

using emscripten::val;
using std::string;
using namespace emscripten;
using namespace std::chrono;

thread_local const val document = val::global("document");

float lerp(float a, float b, float t) {
    return (1 - t) * a + t * b;
}

// all of this stuff is exported to WASM
extern "C"{

    int EMSCRIPTEN_KEEPALIVE addFive(int num){
        return num + 5;
    };

    int EMSCRIPTEN_KEEPALIVE loopNum(int num){
        int i = 0;
        while(i < num){
            i++;
        }
        return num;
    };

}


void drawWave(string canvasID, const val &myVal){
     
        std::vector<float> hello = convertJSArrayToNumberVector<float>(myVal);
        size_t length = hello.size();
        uint64_t ms1 = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
        std::cout << ms1 << " ...milliseconds start: \n";
        float sum = 0;
        for(int i = 0; i < length; i++){
            if(i == length - 1){
                std::cout << "end of loop: " << i  << ", " << hello[i]  <<  "\n";
            }
            sum += hello[i];
            sum = (sum/(i+1));
        }
        uint64_t ms2 = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
        std::cout << ms2 << " ...milliseconds end: \n";
        std::cout << sum << "...C++ Sum";
        

        return;
        const auto document = emscripten::val::global("document");
        const auto canvas = document.call<emscripten::val, std::string>("querySelector", std::string(canvasID));
        auto ctx = canvas.call<emscripten::val, std::string>("getContext", "2d");

        const auto width = canvas["width"].as<int>();
        const auto height = canvas["height"].as<int>();

        // std::cout << width << "\n";

        // ctx.call<void>("clearRect", 0, 0, width, height);

        // // rect
        // ctx.set("fillStyle", "white");
        // ctx.call<void>("fillRect", 0, 0, width, height);

        // // line
        // ctx.set("strokeStyle", "black");
        // ctx.call<void>("moveTo", 0, 0);
        // ctx.call<void>("lineTo", width, height);
        // ctx.call<void>("stroke");


        // // text
        // ctx.set("fillStyle", "black");
        // ctx.set("font", "bold 48px serif");
        // ctx.call<void, std::string>("fillText", "Hello World!", width / 2, height / 2);
}


int main(){
    std::cout<<"hello from wasm!\n";
    return 0;
}

EMSCRIPTEN_BINDINGS(my_module) {
    function("lerp", &lerp);
    function("drawWave",&drawWave);
}