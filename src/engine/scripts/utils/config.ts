import build from "@configuration/client.build.json";

//>>excludeStart("prodHost", pragmas.prodHost);
import local from "@configuration/client.local.json";
//>>excludeEnd("prodHost");

export interface ConfigData {
    dev? : { host : string, port : number, dispatcher : boolean },
    build : { host: string, port: number },
    local? : { host: string, port: number, dispatcher : boolean }
}


let config : ConfigData = {
    dev: { host: "localhost", port: 27000, dispatcher: false },
    build: build
};

//>>excludeStart("prodHost", pragmas.prodHost);
config.local = local;
//>>excludeEnd("prodHost");

export default config;