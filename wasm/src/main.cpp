#include <string>
#include <iostream>
#include <emscripten.h>
#include <emscripten/val.h>
#include <emscripten/bind.h>
#include <vector>
#include <chrono>
#include "draw-waveform.cpp"
#include <SDL2/SDL.h>
#include <cstdlib>
#include <time.h>
#include <thread>

using emscripten::val;
using std::string;
using namespace emscripten;
using namespace std::chrono;

thread_local const val document = val::global("document");

bool isLoopRunning = false;

float lerp(float a, float b, float t) {
    return (1 - t) * a + t * b;
}


int loopNum(int num){
    int i = 0;
    while(i < num){
        i++;
    }
    return num;
};

int addFive(int num){
    return num + 5;
};


class PixelNoiseGenerator {

  public:
  PixelNoiseGenerator(std::string canvasSelector){
    const auto document = emscripten::val::global("document");
    const auto canvas = document.call<emscripten::val, std::string>("querySelector", "canvas");

    auto ctx = canvas.call<emscripten::val, std::string>("getContext", "2d");

    const auto width = canvas["width"].as<int>();
    const auto height = canvas["height"].as<int>();
    int pixelWidth = 1;

    ctx.call<void>("clearRect", 0, 0, width, height);


    // rect
    ctx.set("fillStyle", "white");
    ctx.call<void>("fillRect", 0, 0, width, height);
  
 
    isLoopRunning = true;
    while(isLoopRunning){
        std::this_thread::sleep_for(std::chrono::milliseconds(20));
        for(int x = 0; x < width; x += pixelWidth){
            for(int y = 0; y < height; y += pixelWidth){
                int red = rand()%255;
                int green = rand()%255;
                int blue = rand()%255;
                ctx.set("fillStyle", "rgb("+std::to_string(red)+","+std::to_string(green)+","+std::to_string(blue)+")");
                ctx.call<void>("fillRect", x, y, pixelWidth, pixelWidth);
            }
        }

        emscripten_sleep(0);
    }

  }
  PixelNoiseGenerator(){
    const auto document = emscripten::val::global("document");
    const auto canvas = document.call<emscripten::val, std::string>("querySelector", "#canvas");
    
     SDL_Init(SDL_INIT_VIDEO);
      int WIDTH = canvas["width"].as<int>();
      int HEIGHT = canvas["height"].as<int>();
      int PIXEL_WIDTH = 1;

      
      SDL_Window *window;
      SDL_Renderer *renderer;
      SDL_CreateWindowAndRenderer(WIDTH, HEIGHT, 0, &window, &renderer);

      while (1) {
        std::this_thread::sleep_for(std::chrono::milliseconds(20));
            for(int i = 0; i < WIDTH; i += PIXEL_WIDTH){
                    for(int j = 0; j < HEIGHT; j += PIXEL_WIDTH){
                    SDL_SetRenderDrawColor(renderer, rand()%255, rand()%255, rand()%255, 0);
                    SDL_Rect rect = {.x = i, .y = j, .w = PIXEL_WIDTH, .h = PIXEL_WIDTH};
                    SDL_RenderFillRect(renderer, &rect);
                }
            }

        SDL_RenderPresent(renderer);
        SDL_Event event;
        SDL_PollEvent(&event);
        if (event.type == SDL_QUIT) {
          break;
        }
        #ifdef __EMSCRIPTEN__
            emscripten_sleep(0);
        #endif
      }

      SDL_DestroyRenderer(renderer);
      SDL_DestroyWindow(window);

      SDL_Quit();
  }
};



int main(){
    srand(time(0));
    std::cout<<"hello from wasm!\n";
    drawWaveform("this is a test");
    return 0;
}

void interactWithCanvas(string canvasSelector){
    // const auto document = emscripten::val::global("document");
    // const auto canvas = document.call<emscripten::val, std::string>("querySelector", std::string(canvasSelector));
    PixelNoiseGenerator mygen = PixelNoiseGenerator();
    std::cout << "canvas selector: " + canvasSelector + "\n";
}

// val is a Javascript array, canvasID is well, an id for canvas
void getBuffer(string canvasID, const val &leftChannel){
        std::vector<float> hello = convertJSArrayToNumberVector<float>(leftChannel);
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

        Track newTrack;
        newTrack.bufferLeft = hello;
        newTrack.bufferRight = {};
        newTrack.id = -1;
        TrackPlayer::addTrack(newTrack);
        
        return;
        const auto document = emscripten::val::global("document");
        const auto canvas = document.call<emscripten::val, std::string>("querySelector", std::string(canvasID));
        auto ctx = canvas.call<emscripten::val, std::string>("getContext", "2d");
        const auto width = canvas["width"].as<int>();
        const auto height = canvas["height"].as<int>();
}

EMSCRIPTEN_BINDINGS(my_module) {
    function("lerp", &lerp);
    function("loopNum",&loopNum);
    function("drawWaveform",&drawWaveform);
    function("interactWithCanvas",&interactWithCanvas);
    function("getBuffer",&getBuffer);
}