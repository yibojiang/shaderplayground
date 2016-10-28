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


Shader::Shader(const GLchar* vertexPath, const GLchar* fragmentPath){
  string vertexCode;
  string fragmentCode;
  
  char * dir = getcwd(NULL, 0); // Platform-dependent, see reference link below
  printf("Current dir: %s", dir);
  

  
  ifstream vShaderFile(vertexPath, ifstream::in);
  ifstream fShaderFile(fragmentPath, ifstream::in);
  
  vShaderFile.exceptions(ifstream::badbit);
  fShaderFile.exceptions(ifstream::badbit);
  cout<<"opening"<<endl;
  try{
//    ifstream ifs("C:\\Users\\Imon-Bayazid\\Desktop\\k\\read.txt", ifstream::in);
//     vShaderFile.open(vertexPath, fstream::in | fstream::out | fstream::app);
//     fShaderFile.open(fragmentPath, fstream::in | fstream::out | fstream::app);
    stringstream vShaderStream, fShaderStream;
    
    vShaderStream << vShaderFile.rdbuf();
    fShaderStream << fShaderFile.rdbuf();
    
    vShaderFile.close();
    fShaderFile.close();
    
    vertexCode = vShaderStream.str();
    fragmentCode = fShaderStream.str();
    
    cout << "out" << vertexCode << fragmentCode << endl;

    
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