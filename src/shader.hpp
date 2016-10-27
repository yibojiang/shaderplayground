//
//  Shader.hpp
//  playground
//
//  Created by Yibo Jiang on 10/21/16.
//  Copyright © 2016 Yibo Jiang. All rights reserved.
//

#ifndef Shader_hpp
#define Shader_hpp

#include <stdio.h>
#include <fstream>
#include <sstream>
#include <iostream>

#include <GL/glew.h>


class Shader{
public:
    GLuint shaderProgram;
    Shader(const GLchar* vertexPath, const GLchar* fragmentPath);
    void Use();
};


#endif /* Shader_hpp */