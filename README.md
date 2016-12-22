# shaderplayground

Note: Sublime Build System Configuration
```
{
  "folders":
  [
    {
      "path": "."
    }
  ],
  "build_systems":
    [
      {
        "name": "Build",
         "variants": 
         [
            { "name": "Build",
              "shell_cmd": "make",
              "working_dir": "${project_path:${folder}}/build",
            },

            { "name": "Run With Shader",
              "shell_cmd": "./playground $file 640 480",
              "working_dir": "${project_path:${folder}}/bin",
            }
        ]
      }
    ]
}


```