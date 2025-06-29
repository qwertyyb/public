#include <AppKit/AppKit.h>
#include <napi.h>
#include <string>
#include <Cocoa/Cocoa.h>
#include <QuickLook/QuickLook.h>
#include "getIconForFile.h"

using namespace Napi;

class IconWorker : public AsyncWorker {
public:
    IconWorker(Promise::Deferred deferred, std::string filePath, double size)
        : AsyncWorker(deferred.Env()), deferred(deferred), filePath(filePath), size(size) {}
    
    ~IconWorker() {
        if (buffer) {
            free(buffer);
        }
    }

    void Execute() override {
        @autoreleasepool {
            // 检查文件路径是否有效
            if (filePath.empty()) {
                SetError("File path is empty");
                return;
            }
            
            NSString* nsFilePath = [NSString stringWithUTF8String: filePath.c_str()];
            if (!nsFilePath) {
                SetError("Failed to create NSString from file path");
                return;
            }
            
            NSURL *fileURL = [NSURL fileURLWithPath:nsFilePath];
            if (!fileURL) {
                SetError("Failed to create NSURL from file path");
                return;
            }
            
            // 确保尺寸有效
            if (size <= 0) {
                size = 128; // 使用默认尺寸
            }
            CGSize customSize = CGSizeMake(size, size);

            NSImage* sourceImage = nil;
            
            // 尝试使用QuickLook获取图标
            @try {
                NSDictionary *dict = [NSDictionary dictionaryWithObject:[NSNumber numberWithBool:true] 
                                                                forKey:(NSString *)kQLThumbnailOptionIconModeKey];
                CGImageRef ref = QLThumbnailImageCreate(kCFAllocatorDefault, (CFURLRef)fileURL, customSize, (CFDictionaryRef)dict);

                if (ref != NULL) {
                    NSBitmapImageRep *bitmapImageRep = [[NSBitmapImageRep alloc] initWithCGImage:ref];
                    if (bitmapImageRep) {
                        sourceImage = [[NSImage alloc] initWithSize:[bitmapImageRep size]];
                        [sourceImage addRepresentation:bitmapImageRep];
                        [bitmapImageRep release];
                    }
                    CFRelease(ref);
                }
            } @catch (NSException *exception) {
                NSLog(@"Exception while getting QuickLook thumbnail: %@", exception);
                // 继续执行，尝试使用备用方法
            }

            // 如果QuickLook方法失败，尝试使用NSWorkspace
            if (!sourceImage) {
                @try {
                    sourceImage = [[NSWorkspace sharedWorkspace] iconForFile:nsFilePath];
                    // 保留对象，因为iconForFile返回的是自动释放的对象
                    if (sourceImage) {
                        [sourceImage retain];
                    }
                } @catch (NSException *exception) {
                    NSLog(@"Exception while getting icon from NSWorkspace: %@", exception);
                    SetError("Failed to get icon for file");
                    return;
                }
            }
            
            // 如果仍然没有图标，返回错误
            if (!sourceImage) {
                SetError("Could not get icon for file");
                return;
            }

            NSImage* resizedImage = nil;
            @try {
                resizedImage = [[NSImage alloc] initWithSize:customSize];
                if (!resizedImage) {
                    SetError("Failed to create resized image");
                    [sourceImage release];
                    return;
                }
                
                [resizedImage lockFocus];
                [sourceImage setSize:customSize];
                [[NSGraphicsContext currentContext] setImageInterpolation:NSImageInterpolationHigh];
                [sourceImage drawInRect:NSMakeRect(0, 0, customSize.width, customSize.height)
                               fromRect:NSZeroRect
                              operation:NSCompositingOperationCopy
                               fraction:1.0];
                [resizedImage unlockFocus];
            } @catch (NSException *exception) {
                NSLog(@"Exception while resizing image: %@", exception);
                if (sourceImage) [sourceImage release];
                if (resizedImage) [resizedImage release];
                SetError("Failed to resize icon");
                return;
            }

            NSData* tiffData = nil;
            NSBitmapImageRep* bitmapRep = nil;
            NSData* pngData = nil;
            
            @try {
                tiffData = [resizedImage TIFFRepresentation];
                if (!tiffData) {
                    SetError("Failed to get TIFF representation");
                    [sourceImage release];
                    [resizedImage release];
                    return;
                }
                
                bitmapRep = [NSBitmapImageRep imageRepWithData:tiffData];
                if (!bitmapRep) {
                    SetError("Failed to create bitmap representation");
                    [sourceImage release];
                    [resizedImage release];
                    return;
                }
                
                pngData = [bitmapRep representationUsingType:NSPNGFileType properties:@{}];
                if (!pngData || [pngData length] == 0) {
                    SetError("Failed to create PNG data");
                    [sourceImage release];
                    [resizedImage release];
                    return;
                }
                
                length = [pngData length];
                buffer = (uint8_t*)malloc(length);
                if (buffer) {
                    memcpy(buffer, [pngData bytes], length);
                } else {
                    SetError("Memory allocation failed");
                }
            } @catch (NSException *exception) {
                NSLog(@"Exception while converting image: %@", exception);
                SetError("Exception occurred during image conversion");
            }
            
            // 清理资源
            if (sourceImage) [sourceImage release];
            if (resizedImage) [resizedImage release];
            // bitmapRep是自动释放的，不需要手动释放
        }
    }

    void OnOK() override {
        Buffer<uint8_t> data = Buffer<uint8_t>::Copy(Env(), buffer, length);
        deferred.Resolve(data);
    }

    void OnError(const Error& e) override {
        deferred.Reject(e.Value());
    }

private:
    Promise::Deferred deferred;
    std::string filePath;
    double size;
    uint8_t* buffer = nullptr;
    size_t length = 0;
};

Value GetIconForFile(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 2) {
        TypeError::New(env, "Expected 2 arguments")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsString() || !info[1].IsNumber()) {
        TypeError::New(env, "First argument must be a string, second a number")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string filePath = info[0].As<String>().Utf8Value();
    double size = info[1].As<Number>().DoubleValue();

    Promise::Deferred deferred = Promise::Deferred::New(env);
    IconWorker* worker = new IconWorker(deferred, filePath, size);
    worker->Queue();

    return deferred.Promise();
}

// Napi::Object Init(Napi::Env env, Napi::Object exports) {
//     exports.Set("getIconForFile", Function::New(env, GetIconForFile));
//     return exports;
// }

// NODE_API_MODULE(getIconForFile, Init)