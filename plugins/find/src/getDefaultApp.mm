#include <nan.h>
#include <CoreServices/CoreServices.h>
#include <ApplicationServices/ApplicationServices.h>
#include <Cocoa/Cocoa.h>

void GetDefaultApp(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    if (info.Length() < 1 || !info[0]->IsString()) {
        Nan::ThrowTypeError("Expected a string as the first argument");
        return;
    }

    v8::Isolate* isolate = info.GetIsolate();
    v8::String::Utf8Value filePath(isolate, info[0]);

    CFStringRef path = CFStringCreateWithCString(kCFAllocatorDefault, *filePath, kCFStringEncodingUTF8);
    CFURLRef fileURL = CFURLCreateWithFileSystemPath(kCFAllocatorDefault, path, kCFURLPOSIXPathStyle, false);
    CFRelease(path);

    CFErrorRef error = NULL;
    CFURLRef appURL = LSCopyDefaultApplicationURLForURL(fileURL, kLSRolesAll, &error);
    CFRelease(fileURL);

    if (error != NULL || appURL == NULL) {
        if (error != NULL) {
            CFRelease(error);
        }
        info.GetReturnValue().Set(Nan::Null());
        return;
    }

    CFStringRef appPath = CFURLCopyFileSystemPath(appURL, kCFURLPOSIXPathStyle);
    CFRelease(appURL);

    char appPathCString[PATH_MAX];
    if (CFStringGetCString(appPath, appPathCString, PATH_MAX, kCFStringEncodingUTF8)) {
        info.GetReturnValue().Set(Nan::New(appPathCString).ToLocalChecked());
    } else {
        info.GetReturnValue().Set(Nan::Null());
    }

    CFRelease(appPath);
}

void GetDefaultAppIcon(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    if (info.Length() < 1 || !info[0]->IsString()) {
        Nan::ThrowTypeError("Expected a string as the first argument");
        return;
    }

    v8::Isolate* isolate = info.GetIsolate();
    v8::String::Utf8Value filePath(isolate, info[0]);

    CFStringRef path = CFStringCreateWithCString(kCFAllocatorDefault, *filePath, kCFStringEncodingUTF8);
    CFURLRef fileURL = CFURLCreateWithFileSystemPath(kCFAllocatorDefault, path, kCFURLPOSIXPathStyle, false);
    CFRelease(path);

    CFErrorRef error = NULL;
    CFURLRef appURL = LSCopyDefaultApplicationURLForURL(fileURL, kLSRolesAll, &error);
    CFRelease(fileURL);

    if (error != NULL || appURL == NULL) {
        if (error != NULL) {
            CFRelease(error);
        }
        info.GetReturnValue().Set(Nan::Null());
        return;
    }

    CFStringRef appPath = CFURLCopyFileSystemPath(appURL, kCFURLPOSIXPathStyle);
    CFRelease(appURL);

    NSString *appPathNSString = (__bridge NSString *)appPath;
    NSWorkspace *workspace = [NSWorkspace sharedWorkspace];
    NSImage *appIcon = [workspace iconForFile:appPathNSString];
    CFRelease(appPath);

    if (appIcon == nil) {
        info.GetReturnValue().Set(Nan::Null());
        return;
    }

    NSData *iconData = [appIcon TIFFRepresentation];
    if (iconData == nil) {
        info.GetReturnValue().Set(Nan::Null());
        return;
    }

    v8::Local<v8::Object> buffer = Nan::CopyBuffer((char *)[iconData bytes], [iconData length]).ToLocalChecked();
    info.GetReturnValue().Set(buffer);
}

void Init(v8::Local<v8::Object> exports) {
    Nan::Set(exports, Nan::New("getDefaultApp").ToLocalChecked(),
             Nan::GetFunction(Nan::New<v8::FunctionTemplate>(GetDefaultApp)).ToLocalChecked());
    Nan::Set(exports, Nan::New("getDefaultAppIcon").ToLocalChecked(),
             Nan::GetFunction(Nan::New<v8::FunctionTemplate>(GetDefaultAppIcon)).ToLocalChecked());
}

NODE_MODULE(getDefaultApp, Init)