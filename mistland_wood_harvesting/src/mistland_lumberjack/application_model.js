import { EventDispatcher } from "three";

export class ApplicationModel extends EventDispatcher{

    maxLogs = 20;
    targetGems = 15;

    logCount = 0;
    gemCount = 0;

    onLogCollected(){
        if( this.logCount < this.maxLogs )
        {
            this.logCount++;
        }
    }

    handleLumbermillTick()
    {
        if( this.logCount  > 0 ) {
            this.logCount--;
            this.gemCount++;
        }

        if( this.gemCount == this.getTargetGems() * 0.5 )
        {
            this.dispatchEvent({ type: 'model_event', detail : "unlock_axe"});
        } else if( this.gemCount == this.targetGems ){
            this.dispatchEvent({ type: 'model_event', detail : "unlock_workshop"});
        }
    }

    getTargetGems(){
        // make even if client entered odd number in paramters
        const target = this.targetGems % 2 == 0 ? this.targetGems : this.targetGems-1;
        return target;
    }
}