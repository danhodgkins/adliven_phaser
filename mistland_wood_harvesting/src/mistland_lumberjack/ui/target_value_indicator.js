import { DoubleSide, MeshBasicMaterial, PlaneGeometry, TextureLoader, Mesh, CanvasTexture} from "three";

export default class TargetValueIndicator{
    constructor( { scene, textureRef, target,  yOffset, defaultText })
    {
        this.camera = scene.getObjectByName("main_cam");
         /// direction marker
        const tloader = new TextureLoader();
        const planeSize = 2;

        const texture = tloader.load(textureRef, () => {
            texture.needsUpdate = true;
            const geometry = new PlaneGeometry(planeSize,planeSize); // Width and height
            const material = new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent : true });
            const plane = new Mesh(geometry, material);
            plane.position.copy( target );
            plane.position.y += yOffset;
            scene.add(plane);
            
            this.indicatorPlane = plane;

            const textTexture = createTextTexture(defaultText, {
                fontFamily: 'Arial',
                ontWeight : 'bold',
                textColor: '#000000',
                padding: 20,
                width: 400,
                height: 400
            });

            // text plane 
            const textGeometry = new PlaneGeometry(planeSize,planeSize); // Width and height
            const textMmaterial = new MeshBasicMaterial({ map: textTexture, side: DoubleSide, transparent : true });
            const textPlane = new Mesh(textGeometry, textMmaterial);
            textPlane.position.y-= 0.25;
            textPlane.position.z += 0.2;
            this.textPlane = textPlane;
            plane.add(textPlane);
        });  


    }

    updateText( newVal )
    {
        const textTexture = createTextTexture( newVal , {
            fontFamily: 'Arial',
            fontWeight : 'bold',
            textColor: '#000000',
            padding: 20,
            width: 400,
            height: 400
        });
        this.textPlane.material.map = textTexture;
    }

    update(dt) {
        if( this.indicatorPlane ) this.indicatorPlane.lookAt( this.camera.position );
    }
}

function createTextTexture(text, options = {}) {
    const {
        fontFamily = 'Arial',
        fontWeight = 'bold',
        textColor = '#fff',
        backgroundColor = 'transparent',
        padding = 20,
        width = 512,
        height = 256,
        maxFontSize = 100
    } = options;

    // 1. Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 2. Background
    if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
    } else {
        ctx.clearRect(0, 0, width, height);
    }

    // 3. Find best font size
    let fontSize = maxFontSize;
    do {
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(text);
        if (metrics.width <= width - padding * 2) break;
        fontSize -= 2;
    } while (fontSize > 10);

    // 4. Draw text
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    // 5. Create Three.js texture
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}