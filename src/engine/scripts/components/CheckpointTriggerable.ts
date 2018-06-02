import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import { CheckpointArea } from "@common/GameMap";

export default class CheckpointTriggerable implements Component {
    static c_name : string = "CheckpointTriggerable";
	static c_id : Bitfield;
    enabled = true;

    lastCheckpoint : CheckpointArea;
}