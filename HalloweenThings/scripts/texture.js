

class Texture {

    static textures = new Map()
    static rectangles = []
    static image

    constructor(name) {
        this.rect = Texture.rectangles[name]
    }

    static download() {

        // This code is not perfect, btw
        // it cannot get much better without creating
        // a ton of utility files

        return new Promise((resolve, reject) => {

            let atlasImage = new Image()
            atlasImage.src = "./textures/atlas.png"

            atlasImage.addEventListener("load", function(){
                if (this.complete) {
                    Texture.image = this
                    if(Texture.rectangles) resolve()
                } else {
                    reject("Failed to download atlas image")
                }
            })

            let xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState === 4) {
                    if(xmlhttp.status === 200) {
                        try {
                            Texture.rectangles = JSON.parse(xmlhttp.responseText);
                            if (Texture.image) resolve()
                        } catch (err) {
                            reject(err)
                        }
                    } else {
                        reject("Failed to download atlas json")
                    }
                }
            }
            xmlhttp.onerror = function() {
                reject("Failed to download atlas json")
            }

            xmlhttp.open("GET", "./textures/atlas.json", true);
            xmlhttp.send();
        }).then(() => {
            for(let [name] of Object.entries(Texture.rectangles)) {
                console.log(name)
                Texture.textures.set(name, new Texture(name))
            }
        })
    }

    /**
     * @param name Name of the sprite, like "tanks/sniper/body-bright"
     * @returns {Texture} The sprite associated with this name
     */

    static named(name) {
        return Texture.textures.get(name)
    }
}

module.exports = Texture