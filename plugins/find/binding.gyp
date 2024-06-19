{
  "targets": [
    {
      "target_name": "getDefaultApp",
      "sources": [ "src/getDefaultApp.mm" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "xcode_settings": {
        "OTHER_CFLAGS": [ "-fno-exceptions" ],
        "OTHER_CPLUSPLUSFLAGS": [ "-fno-exceptions" ]
      },
      "conditions": [
        [ 'OS=="mac"', {
          "libraries": [
            "-framework CoreServices",
            "-framework Foundation",
            "-framework Cocoa"
          ]
        }]
      ]
    }
  ]
}