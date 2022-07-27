#include <string>
#include <iostream>
#include <emscripten.h>
#include <emscripten/val.h>
#include <emscripten/bind.h>
#include <vector>
#include <chrono>
#include <SDL2/SDL.h>
#include <cstdlib>
#include <time.h>
#include <thread>

struct Track {
    std::vector<float> bufferLeft;
    std::vector<float> bufferRight;
    int id;
};

void drawWaveform(std::string input){
    std::cout << input << "\n";
}

class TrackPlayer{
    public:
        static int trackCount;
        static std::vector<Track> tracks;
        static void addTrack(Track track){
            trackCount++;
            track.id = trackCount;
            tracks.push_back(track);
            std::cout << "\nSuccessefully added track. Track count is now: " << trackCount << "\n";
        };
        static Track getTrackById(int id){
            int index = getIndex(id);
            if(index < 0){
                Track empty;
                return empty;
            }else{
                return tracks[index];
            }     
        }
        static int getIndex(int id) {
            for(int i = 0; i < tracks.size(); i++){
                if(tracks[i].id == id){
                    return i;
                    break;
                }
            }
            return -1;
        }
        static void printTracks() {
            for(int i = 0; i < tracks.size(); i++) {
                std::cout << "id: " << tracks[i].id << ", " << "length: " << tracks[i].bufferLeft.size();
            }
        }

        static void deleteTrack(int id){
            tracks.erase(tracks.begin() + id);
        }
};

int TrackPlayer::trackCount = 0;
std::vector<Track> TrackPlayer::tracks = {};


