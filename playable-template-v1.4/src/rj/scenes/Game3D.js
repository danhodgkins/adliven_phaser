// import * as Phaser from '../phaser/phaser-3.87.0-core.js';

import { adStart, onCtaPressed, onAudioVolumeChange } from '../../networkPlugin';
import { Scene3D, THREE } from '@enable3d/phaser-extension';
export class Game3D extends Scene3D {
    constructor() {
        console.log('constructor game3d;')
        // super('Game3D' )
        super({ key: 'Game3D' })
    }

    

    init() {
      // init third dimension with a custom camera
      // https://threejs.org/docs/#api/en/cameras/OrthographicCamera
      const frustumSize = 10
      const aspect = this.cameras.main.width / this.cameras.main.height
      this.accessThirdDimension({
        camera: new THREE.OrthographicCamera(
          (frustumSize * aspect) / -2,
          (frustumSize * aspect) / 2,
          frustumSize / 2,
          frustumSize / -2
        )
      })
    }

    create() {
        this.third.warpSpeed('-camera')
        this.third.camera.position.set(10, 10, 10)
        this.third.camera.lookAt(0, 0, 0)

        this.third.add.box({ x: 1, y: 0.5, z: 0.5, depth: 2 }, { lambert: { color: 'darkviolet' } })
        this.third.add.box({ z: 1, y: 1, height: 2 }, { lambert: { color: 'darkorange' } })
        this.third.add.box({ x: 0.5, y: 1.5, width: 2 }, { lambert: { color: 'red' } })

        this.input.on('pointerdown', () => {

            this.sound.play('sound_fx');

            onCtaPressed();

        });

      }
    


    // init() {
    //     console.log('%cSCENE::Game3D', 'color: #fff; background: #f0f;');
    //     this.accessThirdDimension()
    // }

    /**
     * This is required specially for Mintegral & MRAID networks. 
     * Do not remove if you are using those networks.
     */
    adNetworkSetup() {
        adStart();

        // This is required for MRAID networks, you can remove if you are not using MRAID
        onAudioVolumeChange(this.scene);
    }

//     create() {
//         this.third.warpSpeed();

//         this.adNetworkSetup();

//         //  This is all just tests to prove the assets have loaded properly.
//         const midX = this.scale.width / 2;
//         const midY = this.scale.height / 2;

//         const redBox = this.third.physics.add.box(
//             { name: 'redBox', y: 10, z: 0.5, width: 2, height: 2 },
//             { lambert: { color: 0xff0000 } }
//           )
//           const blueBox = this.third.physics.add.box(
//             { name: 'blueBox', x: 0.5, y: 15, z: 1.1, depth: 3 },
//             { lambert: { color: 0x0000ff } }
//           )
//           const greenBox = this.third.physics.add.box(
//             { name: 'greenBox', x: 1, y: 20, depth: 2, height: 2 },
//             { lambert: { color: 0x00ff00 } }
//           )

//           this.third.physics.add.collider(redBox, greenBox, event => {
//             console.log(`redBox and greenBox: ${event}`)
//           })

//           blueBox.body.on.collision((otherObject, event) => {
//             if (otherObject.name !== 'ground') console.log(`blueBox and ${otherObject.name}: ${event}`)
//           })

        
//     }
}
