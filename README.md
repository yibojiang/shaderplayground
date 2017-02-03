# shaderplayground

A desktop version of Shadertoy.

Compile:

Build with Cmake.
```
    mkdir build/
    cmake -G Unix\ Makefiles ../
    make
```

After it is build, the binary "playground" should be in bin/ folder.

Usage:

- save your shader with *.frag
- run ./playground default.frag WIDTH HEIGHT
- "return" to reload the shader
- "s" to render it into /bin/output/