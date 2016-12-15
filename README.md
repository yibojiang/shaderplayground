# shaderplayground

Note: Sublime Build System Configuration
```
{
  "shell_cmd": "make",
  "working_dir": "${project_path:${folder}}/build",
  "variants": [

        { "name": "Build",
          "shell_cmd": "make",
          "working_dir": "${project_path:${folder}}/build",
        },

        { "name": "Run With Shader",
          "shell_cmd": "./playground terrain_test.frag 640 480",
          "working_dir": "${project_path:${folder}}/bin",
        },
        { "name": "Run",
          "shell_cmd": "./playground default.frag",
          "working_dir": "${project_path:${folder}}/bin",
        }
    ]
}
```