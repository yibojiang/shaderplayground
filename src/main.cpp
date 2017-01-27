
#include <iostream>


// GLEW
#define GLEW_STATIC
#include <GL/glew.h>

// GLFW
#include <GLFW/glfw3.h>
#include "shader.hpp"
#include <SOIL.h>

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <string>
#include <sstream>
#include <iomanip>
#include <vector>




GLfloat vertices[] = {
    // Positions          // Colors           // Texture Coords
    1.0f,  1.0f, 0.0f,   1.0f, 0.0f, 0.0f,   1.0f, 1.0f, // Top Right 0
    1.0f, -1.0f, 0.0f,   0.0f, 1.0f, 0.0f,   1.0f, 0.0f, // Bottom Right 1
    -1.0f, -1.0f, 0.0f,   0.0f, 0.0f, 1.0f,  0.0f, 0.0f, // Bottom Left 2
    -1.0f,  1.0f, 0.0f,   1.0f, 1.0f, 0.0f,  0.0f, 1.0f  // Top Left 3
};

GLuint indices[] = {
    0, 1, 3,
    1, 2, 3
};

#include <iostream>
#include <unistd.h>
#include <ctime>


// const GLuint WIDTH = 3840, HEIGHT = 2080;
// const GLuint WIDTH = 3456, HEIGHT = 1944;
// const GLuint WIDTH = 320, HEIGHT = 240;
// const GLuint WIDTH = 800, HEIGHT = 600;
GLuint WIDTH = 640, HEIGHT = 480;

using namespace std;

Shader *shader;
char* fragpath;
double mousexPos, mouseyPos;
bool recording;

struct Vector{ float x,y,z; };


GLuint loadCubemap(vector<string> faces);

void key_callback(GLFWwindow* window, int key, int scancode, int action, int mode);
void mousemove_callback(GLFWwindow* window, double xPos, double yPos);
void mouse_callback(GLFWwindow *window, int button, int action, int mods);

void key_callback(GLFWwindow* window, int key, int scancode, int action, int mode)
{
    // When a user presses the escape key, we set the WindowShouldClose property to true,
    // closing the application
    
    if(key == GLFW_KEY_ESCAPE && action == GLFW_PRESS)
        glfwSetWindowShouldClose(window, GL_TRUE);
    if(key == GLFW_KEY_S && action == GLFW_PRESS)
        recording = !recording;
    if(key == GLFW_KEY_ENTER && action == GLFW_PRESS){
        delete shader;
        shader = new Shader("v.vert", fragpath);
        cout << "compile shader " << fragpath << endl;
        
    }
}

void mousemove_callback(GLFWwindow* window, double xPos, double yPos)
{
    mousexPos = xPos;
    mouseyPos = yPos;
    // cout << xPos << ", " << yPos << endl;

}

int mousebutton;
int mouseaction;

void mouse_callback(GLFWwindow *window, int button, int action, int mods)
{
    mousebutton = button;
    mouseaction = action;
    cout << button << ", " << action << ", " << mods << endl;
    cout << mousexPos << ", " << mouseyPos << endl;
}

GLuint loadCubemap(vector<string> faces)
{
    GLuint textureID;
    glGenTextures(1, &textureID);

    int width,height;
    unsigned char* image;
    
    glBindTexture(GL_TEXTURE_CUBE_MAP, textureID);
    for(GLuint i = 0; i < faces.size(); i++)
    {
        image = SOIL_load_image(faces[i].c_str(), &width, &height, 0, SOIL_LOAD_RGB);
        glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, image);
        SOIL_free_image_data(image);

        // cout << "loading image: "<< faces[i] << endl;
        // cout<< SOIL_last_result()<<endl;
    }
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);
    glBindTexture(GL_TEXTURE_CUBE_MAP, 0);

    return textureID;
}

std::string format(long num, unsigned int length=4) {
  std::ostringstream oss;
  oss << std::setfill('0') << std::setw(length) << num;
  // return oss.str().insert(3, "-").insert(6, "-");
  return oss.str();
};

// The MAIN function, from here we start the application and run the game loop
int main(int argc, char** argv)
{
    recording = false;
    cout << "argc = " << argc << endl; 
    for(int i = 0; i < argc; i++) 
        cout << "argv[" << i << "] = " << argv[i] << endl;
    fragpath = argv[1];
    if (argv[2] && argv[3]){

        WIDTH = atoi(argv[2]);
        HEIGHT = atoi(argv[3]);
    }  
    cout<< "Size:" << WIDTH << ", "<< HEIGHT << endl;    
    cout << "compile shader " << fragpath << endl;

    std::cout << "Starting GLFW context, OpenGL 3.3" << std::endl;
    
    // Init GLFW
    glfwInit();
    
    // Set all the required options for GLFW
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_RESIZABLE, GL_FALSE);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
    
    int count;
    GLFWmonitor** monitors = glfwGetMonitors(&count);
    // Create a GLFWwindow object that we can use for GLFW's functions
    // GLFWwindow* window = glfwCreateWindow(WIDTH, HEIGHT, "Shader Playground", monitors[0], nullptr);
    GLFWwindow* window = glfwCreateWindow(WIDTH, HEIGHT, "Shader Playground", nullptr, nullptr);
    if (window == nullptr)
    {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    
    // Add Callback to the windows
    glfwSetKeyCallback(window, key_callback);
    glfwSetCursorPosCallback(window, mousemove_callback);
    glfwSetMouseButtonCallback(window, mouse_callback);
    
    glfwMakeContextCurrent(window);
    // Set this to true so GLEW knows to use a modern approach to retrieving function pointers and extensions
    glewExperimental = GL_TRUE;
    // Initialize GLEW to setup the OpenGL Function pointers
    if (glewInit() != GLEW_OK)
    {
        std::cout << "Failed to initialize GLEW" << std::endl;
        return -1;
    }
    
    // Define the viewport dimensions
    // int width, height;
    // glfwGetFramebufferSize(window, &width, &height);
    // glViewport(0, 0, width, height);
    // printf("resolution: %d x %d", width, height);
    
    // chdir(argv[0]);
    // chdir("/");
    // chdir("/Users/yjiang6/Documents/Programming/shaderplayground/build/src/playground");
    // char * dir = getcwd(NULL, 0); 
    // printf("Current dir: %s", dir);
    
    
    // Vertex Buffer Object and Vertex Array Object
    GLuint VBO, VAO;
    GLuint EBO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
    glGenBuffers(1, &EBO);
    
    // Use the Shader Program, and sent the vertex shader and fragment shader to GPU.
    // 1. Bind Vertex Array Object
    glBindVertexArray(VAO);
    // 2. Copy our vertices array in a buffer for OpenGL to use
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    // BufferData is copying data to Buffer.
    
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
    
    // 3. Then set our vertex attributes pointers, and tell GPU how to interpret the vertex data.
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(GLfloat), (GLvoid*)0);
    glEnableVertexAttribArray(0);
    
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(GLfloat), (GLvoid*)(3 * sizeof(GLfloat)));
    glEnableVertexAttribArray(1);
    
    glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(GLfloat), (GLvoid*)(6 * sizeof(GLfloat)));
    glEnableVertexAttribArray(2);
    //4. Unbind the VAO
    glBindVertexArray(0);
    
    int texCount = 21;
    // char* *texturename = new char*[texCount];
    string *texturename = new string[texCount];
    texturename[0] = "tex01.jpg";
    texturename[1] = "tex02.jpg";
    texturename[2] = "tex03.jpg";
    texturename[3] = "tex04.jpg";
    texturename[4] = "tex05.png";
    texturename[5] = "tex06.jpg";
    texturename[6] = "tex07.jpg";
    texturename[7] = "tex08.jpg";
    texturename[8] = "tex09.jpg";
    texturename[9] = "tex10.png";
    texturename[10] = "tex11.png";
    texturename[11] = "tex12.png";
    texturename[12] = "tex13.png";
    texturename[13] = "tex14.png";
    texturename[14] = "tex15.png";
    texturename[15] = "tex16.png";
    texturename[16] = "tex17.jpg";
    texturename[17] = "tex18.jpg";
    texturename[18] = "tex19.png";
    texturename[19] = "tex20.jpg";
    texturename[20] = "tex21.png";

    Vector *iChannelResolution = new Vector[texCount];

    GLuint *texture = new GLuint[texCount];
    for (int i = 0; i < texCount; ++i){

        glGenTextures(1, &texture[i]);
        glBindTexture(GL_TEXTURE_2D, texture[i]);
        // Set the texture wrapping parameters
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);   // Set texture wrapping to GL_REPEAT (usually basic wrapping method)
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
        // Set texture filtering parameters

        // Texture Minification.
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        // glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);

        // Texture Magnification.
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        // glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
        
        int texWidth, texHeight;
        unsigned char* image = SOIL_load_image(texturename[i].c_str(), &texWidth, &texHeight, 0, SOIL_LOAD_RGB);

        // cout << "loading image: "<< texturename[i] << endl;
        // cout<< SOIL_last_result()<<endl;
        if (image == NULL)
            cout << texturename[i] << " is null" << endl; 
        else
            cout << texturename[i] << " is loaded" << endl;
    //    The first argument specifies the texture target; setting this to GL_TEXTURE_2D means this operation will generate a texture on the currently bound texture object at the same target (so any textures bound to targets GL_TEXTURE_1D or GL_TEXTURE_3D will not be affected).
    //    The second argument specifies the mipmap level for which we want to create a texture for if you want to set each mipmap level manually, but we'll leave it at the base level which is 0.
    //        The third argument tells OpenGL in what kind of format we want to store the texture. Our image has only RGB values so we'll store the texture with RGB values as well.
    //        The 4th and 5th argument sets the width and height of the resulting texture. We stored those earlier when loading the image so we'll use the corresponding variables.
    //        The next argument should always be 0 (some legacy stuff).
    //        The 7th and 8th argument specify the format and datatype of the source image. We loaded the image with RGB values and stored them as chars (bytes) so we'll pass in the corresponding values.
    //        The last argument is the actual image data.
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, texWidth, texHeight, 0, GL_RGB, GL_UNSIGNED_BYTE, image);
        // glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, 2, 2, 0, GL_RGB, GL_FLOAT, image);
        // glGenerateMipmap(GL_TEXTURE_2D);
        iChannelResolution[i].x = texWidth;
        iChannelResolution[i].y = texHeight;

        SOIL_free_image_data(image);
        glBindTexture(GL_TEXTURE_2D, 0);
    }

    int skyboxCount = 5;
    GLuint *skyboxTexture = new GLuint[skyboxCount];
    string *skytexturename = new string[skyboxCount];
    string *skytextureext = new string[skyboxCount];
    skytexturename[0] = "cube00";skytextureext[0] = "jpg";
    skytexturename[1] = "cube01";skytextureext[1] = "png";
    skytexturename[2] = "cube02";skytextureext[2] = "jpg";
    skytexturename[3] = "cube03";skytextureext[3] = "png";
    skytexturename[4] = "cube04";skytextureext[4] = "png";

    for (int i = 0; i < skyboxCount; ++i){
        // vector<const GLchar*> faces;
        vector<string> faces;
        

        for (int j = 0; j < 6; ++j){

            char buff[100];
            snprintf(buff, 100*sizeof(char), "%s/%s_%d.%s", skytexturename[i].c_str(), skytexturename[i].c_str(), j, skytextureext[i].c_str());
            string buffAsStdStr = buff;
            faces.push_back(buffAsStdStr);
        }
        
        skyboxTexture[i] = loadCubemap(faces);
    }


    shader = new Shader("v.vert", fragpath);
    // GLuint textureID;
    // glGenTextures(1, &textureID);
    // glBindTexture(GL_TEXTURE_CUBE_MAP, textureID);
    
    double lastTime = glfwGetTime();
    int nbFrames =0;
    int frames =0;

    // Game loop
    while (!glfwWindowShouldClose(window))
    {
        // If you intend to make a 60fps game, your target will be 16.6666ms ; 
        // If you intend to make a 30fps game, your target will be 33.3333ms. That’s all you need to know.
        double currentTime = glfwGetTime();
        nbFrames++;
        frames++;
        if ( currentTime - lastTime >= 1.0 ){ // If last prinf() was more than 1 sec ago
            // printf and reset timer
            // printf("%f ms/frame\n", 1000.0/double(nbFrames));
            cout << 1000.0/double(nbFrames) << " ms/frame" << endl;
            nbFrames = 0;
            lastTime += 1.0;
        }

        // Check if any events have been activiated (key pressed, mouse moved etc.) and call corresponding response functions
        glfwPollEvents();
        
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        
        
//        glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);
        shader->Use();

        

        GLfloat timeValue = glfwGetTime();
        GLuint fragTimeLocation = glGetUniformLocation(shader->shaderProgram, "iGlobalTime");
        glUniform1f(fragTimeLocation, timeValue);
        
        GLuint fragResLocation = glGetUniformLocation(shader->shaderProgram, "iResolution");
        glUniform2f(fragResLocation, WIDTH, HEIGHT);

        GLuint fragMouseLocation = glGetUniformLocation(shader->shaderProgram, "iMouse");
        glUniform4f(fragMouseLocation, mousexPos, HEIGHT-mouseyPos, mousebutton, mouseaction);

        GLuint fragDateLocation = glGetUniformLocation(shader->shaderProgram, "iDate");


        time_t t = time(0);
        struct tm * now = localtime( & t );
        
        struct tm y2k = {0};
        y2k.tm_hour = 0;   y2k.tm_min = 0; y2k.tm_sec = 0;
        y2k.tm_year = 100; y2k.tm_mon = 0; y2k.tm_mday = 1;
        double seconds = difftime(t,mktime(&y2k));
        glUniform4f(fragDateLocation, now->tm_year + 1900, now->tm_mon + 1, now->tm_mday, seconds);


        
        GLuint transformLoc = glGetUniformLocation(shader->shaderProgram, "transform");
        glm::mat4 trans;
        // trans = glm::rotate(trans, glm::radians(180.0f), glm::vec3(1.0, 0.0, 0.0));
        // trans = glm::rotate(trans, glm::radians(180.0f), glm::vec3(0.0, 0.0, 1.0));
        // cout<<timeValue<<endl;
        trans = glm::scale(trans, glm::vec3(1, 1, 1));  
        // 
        glUniformMatrix4fv(transformLoc, 1, GL_FALSE, glm::value_ptr(trans));

        
        
        for (int i = 0; i < texCount; i++ ){
            string channelid = "iChannel" + to_string(i);
            // string channelResid = "iChannelResolution" + to_string(i);
            // cout<<"binding channel: "<<channelid<<endl;
            // texResLoc = glGetUniformLocation(shader->shaderProgram, channelResid.c_str());
            glUniform3fv(glGetUniformLocation(shader->shaderProgram, "iChannelResolution"), texCount, (const GLfloat*)iChannelResolution);
            glUniform1i(glGetUniformLocation(shader->shaderProgram, channelid.c_str()), i); 
            glActiveTexture(GL_TEXTURE0 + i);
            glBindTexture(GL_TEXTURE_2D, texture[i]);
        }

        
        // Now draw the nanosuit
        for (int i = 0; i < skyboxCount; ++i){
            string skyboxid = "skybox" + to_string(i);
            glUniform1i(glGetUniformLocation(shader->shaderProgram, skyboxid.c_str()), texCount + i);
            glActiveTexture(GL_TEXTURE0 + texCount + i);
            glBindTexture(GL_TEXTURE_CUBE_MAP, skyboxTexture[i]); 
        }
        
        glBindVertexArray(VAO);
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
        glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
        glBindVertexArray(0);

        if (recording){
            string outputname = "output/output" + format(frames) + ".bmp";
            int saveResult = SOIL_save_screenshot(outputname.c_str(), SOIL_SAVE_TYPE_BMP, 0, 0, WIDTH * 2, HEIGHT * 2);
            cout << WIDTH <<'x' << HEIGHT << endl;
            cout << outputname <<"result: " << saveResult << endl;    
        }
        
        
        // Swap the screen buffers
        glfwSwapBuffers(window);

        // std::vector< unsigned char> rgbdata(4*WIDTH*HEIGHT);
        // glReadPixels(0, 0, WIDTH, HEIGHT,GL_RGBA,GL_UNSIGNED_BYTE, &rgbdata[0]);
        // string outputname = "output/output" + format(nbFrames) + ".bmp";
        // int saveResult = SOIL_save_image
        // (
        //     outputname.c_str(),
        //     SOIL_SAVE_TYPE_BMP,
        //     WIDTH, HEIGHT, 4,
        //     rgbdata.data()
        // );


    }
    
    delete shader;
    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteBuffers(1, &EBO);
    // Terminate GLFW, clearing any resources allocated by GLFW.
    glfwTerminate();
    return 0;
}