{
  "targets": [
    {
      "target_name": "addon",
      "sources": [
        "lib/addon.mm",
        "lib/DictionaryKit/TTTDictionary.m",
        "lib/getIconForFile.mm"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "lib"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions", "-Warc-bridge-casts-disallowed-in-nonarc"],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.15"
      },
      "conditions": [
        ["OS=='mac'", {
          "link_settings": {
            "libraries": [
              "-framework Cocoa",
              "-framework Foundation",
              "-framework QuickLook",
              "-framework AppKit",
              "-framework CoreFoundation"
            ]
          }
        }]
      ]
    }
  ]
}