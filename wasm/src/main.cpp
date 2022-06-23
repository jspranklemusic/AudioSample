#include <string>
#include <iostream>
#include <emscripten.h>
#include <emscripten/val.h>
#include <emscripten/bind.h>
#include <vector>

using emscripten::val;
using std::string;
using namespace emscripten;

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

void drawWave(string canvasID, int* buffer){
        std::cout << buffer << "\n";
        std::cout << "buffer \n";
        return;
        const auto document = emscripten::val::global("document");
        const auto canvas = document.call<emscripten::val, std::string>("querySelector", std::string(canvasID));
        auto ctx = canvas.call<emscripten::val, std::string>("getContext", "2d");

        const auto width = canvas["width"].as<int>();
        const auto height = canvas["height"].as<int>();

        std::cout << width << "\n";

        ctx.call<void>("clearRect", 0, 0, width, height);

        // rect
        ctx.set("fillStyle", "white");
        ctx.call<void>("fillRect", 0, 0, width, height);

        // line
        ctx.set("strokeStyle", "black");
        ctx.call<void>("moveTo", 0, 0);
        ctx.call<void>("lineTo", width, height);
        ctx.call<void>("stroke");

        for(int i = 0; i < 1000; i++){

        }

        // text
        ctx.set("fillStyle", "black");
        ctx.set("font", "bold 48px serif");
        ctx.call<void, std::string>("fillText", "Hello World!", width / 2, height / 2);
}


int main(){
    std::cout<<"hello from wasm!\n";
    return 0;
}

EMSCRIPTEN_BINDINGS(my_module) {
    function("lerp", &lerp);
    function("drawWave",&drawWave, allow_raw_pointers());
}