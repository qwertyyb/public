{
	"targets": [
		{
			"target_name": "getIconForFile",
			"include_dirs": ["<!(node -e \"require('nan')\")"],
			"conditions": [[
				'OS=="mac"',
				{
					"sources": ["lib/getIconForFile.mm"],
					"link_settings": {
						"libraries": ["-framework AppKit -framework QuickLook"]
					}
				}
			]
			]
		},
		{
			"target_name": "pinyin",
			"include_dirs": ["<!(node -e \"require('nan')\")"],
			"conditions": [[
				'OS=="mac"',
				{
					"sources": ["lib/pinyin.mm"],
					"link_settings": {
						"libraries": ["-framework AppKit"]
					}
				}
			]
			]
		},
	]
}
