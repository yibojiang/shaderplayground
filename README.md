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
        { 
          "name": "List All Shader",
                "shell_cmd": "ls -l *.frag",
                "working_dir": "${project_path:${folder}}/bin"
            },
          { 
            "name": "Build C++",
              "shell_cmd": "make",
              "working_dir": "${project_path:${folder}}/build",
          },
          { 
            "name": "Run Current Shader",
              "shell_cmd": "./playground $file 640 480",
              "working_dir": "${project_path:${folder}}/bin",
          }
      ]
    }
  ]
}


```