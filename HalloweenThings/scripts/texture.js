
const Atlas = require("../build/textures/atlas.js")

class Texture {

    static textures = new Map()
    static rectangles = []
    static image

    constructor(name) {
        this.rect = Texture.rectangles[name]
    }

    static download() {

        Texture.rectangles = Atlas

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