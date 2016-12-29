;//
//  Shader.cpp
//  playground
//
//  Created by Yibo Jiang on 10/21/16.
//  Copyright © 2016 Yibo Jiang. All rights reserved.
//


#include "Shader.hpp"

#include <unistd.h>
using namespace std;

#define MULTI_LINE_STRING(a) #a

Shader::Shader(const GLchar* vertexPath, const GLchar* fragmentPath){
  string vertexCode;
  string fragmentCode;
  
  // char * dir = getcwd(NULL, 0); // Platform-dependent, see reference link below

  
  ifstream vShaderFile(vertexPath, ifstream::in);
  ifstream fShaderFile(fragmentPath, ifstream::in);
  
  vShaderFile.exceptions(ifstream::badbit);
  fShaderFile.exceptions(ifstream::badbit);
  cout<<"opening"<<endl;
  try{
    stringstream vShaderStream, fShaderStream;
    
    vShaderStream << vShaderFile.rdbuf();
    fShaderStream << fShaderFile.rdbuf();
    
    vShaderFile.close();
    fShaderFile.close();
    
    vertexCode = vShaderStream.str();
    fragmentCode = fShaderStream.str();

    fragmentCode = MULTI_LINE_STRING(#version 330 core
    in vec3 vertexColor;
    in vec3 vertexPosition;
    in vec2 fragCoord;

    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;
    uniform sampler2D iChannel3;
    uniform sampler2D iChannel4;
    uniform sampler2D iChannel5;
    uniform sampler2D iChannel6;
    uniform sampler2D iChannel7;
    uniform sampler2D iChannel8;
    uniform sampler2D iChannel9;
    uniform sampler2D iChannel10;
    uniform sampler2D iChannel11;
    uniform sampler2D iChannel12;
    uniform sampler2D iChannel13;
    uniform sampler2D iChannel14;
    uniform sampler2D iChannel15;
    uniform sampler2D iChannel16;
    uniform sampler2D iChannel17;
    uniform sampler2D iChannel18;
    uniform sampler2D iChannel19;
    uniform sampler2D iChannel20;


    uniform samplerCube skybox0;
    uniform samplerCube skybox1;
    uniform samplerCube skybox2;
    uniform samplerCube skybox3;
    uniform samplerCube skybox4;

    uniform vec3 iChannelResolution[21];

    uniform vec4 iDate;
    uniform float iGlobalTime;
    uniform vec2 iResolution;
    uniform vec4 iMouse;
    out vec4 fragColor;
    vec4 texture2D(sampler2D sampler, vec2 coord){mat2 mt = mat2(1, 0, 0, -1); return texture(sampler, mt*coord);}
    vec4 texture2D(sampler2D sampler, vec2 coord, float bias){mat2 mt = mat2(1, 0, 0, -1); return texture(sampler, mt*coord, bias);}
    vec4 textureCube(samplerCube sampler, vec3 coord){mat2 mt = mat2(1, 0, 0, -1); return texture(sampler, coord);}
    )
    + fragmentCode+ "void main(){mainImage(fragColor, fragCoord);}";
    
    // cout << "out" << vertexCode << fragmentCode << endl;

    
  }
  catch(ifstream::failure e){
    cout << "ERROR""SHADER::FILE_NOTSUCESSFULLY_READ" << endl;
  }
  
  const GLchar* vShaderCode = vertexCode.c_str();
  const GLchar* fShaderCode = fragmentCode.c_str();
  
  // Create a vetex shader;
  GLuint vertexShader;
  vertexShader = glCreateShader(GL_VERTEX_SHADER);
  glShaderSource(vertexShader, 1, &vShaderCode, NULL);
  glCompileShader(vertexShader);

  GLint success;
  GLchar infoLog[512];
  glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);

  // Check if it succeeds.
  if(!success)
  {
      glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
      std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
  }
  // Create a fragment Shader.
  GLuint fragmentShader;
  fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
  glShaderSource(fragmentShader, 1, &fShaderCode, NULL);
  glCompileShader(fragmentShader);

  glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);

  // Check if it succeeds.
  if(!success)
  {
      glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog);
      std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
  }

  shaderProgram = glCreateProgram();
  glAttachShader(shaderProgram, vertexShader);
  glAttachShader(shaderProgram, fragmentShader);
  glLinkProgram(shaderProgram);
  
  // Check if it succeeds.
  glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
  if(!success) {
    glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
  }
  
  glDeleteShader(vertexShader);
  glDeleteShader(fragmentShader);
}

void Shader::Use(){
  glUseProgram(shaderProgram);
}