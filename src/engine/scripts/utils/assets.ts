/**
 * Set of utility methods to get the filepaths to the game's resources.
 */
module Assets {
    export function PathToItemImage (name : string, scale : number) {
        return "assets/img/" + scale + "/item-" + name + ".png";
    }
    export function PathToTilesetImage (name : string, scale : number) {
        return "assets/img/" + scale + "/" + name + ".png";
    }
    export function PathToSpriteImage (name : string, scale : number) {
        return "assets/img/" + scale + "/" + name + ".png";
    }
    export function PathToSound (name : string, extension : string) {
        return "assets/audio/sounds/" + name + "." + extension;
    }
    export function PathToMusic (name : string, extension : string) {
        return "assets/audio/music/" + name + "." + extension;
    }
    export function PathToAsset (name : string) {
        return "assets/" + name;
    }
    export function PathToPrefab (name : string) {
        return "assets/prefabs/" + name + ".json";
    }

    export enum PathType {
        Directory,
        FileWithExtension,
        FileWithoutExtension
    }

    export class Path {
        private directories : string[] = [];
        private filename : string = "";
        private fileExtension : string = "";
        private pathType : PathType;

        public isFile () : boolean {
            return this.filename !== "";
        }

        public getExtension () : string {
            return this.fileExtension;
        }

        public getFileName (withExtension : boolean = false) : string {
            return `${this.filename}${withExtension ? this.fileExtension : ""}`;
        }

        public isAbsolute () : boolean {
            return this.directories[0] === "";
        }

        /**
         * Gets the path as a string with "/" separator.
         * 
         * If is directory will end with "/".
         * 
         * @returns {string} 
         * @memberof Path
         */
        public toString () : string {
            return `${this.directories[0] === "" ? "/" : ""}${this.directories.join("/")}${this.filename}${this.fileExtension}`;
        }

        public getSeparator (path : string) : string {
            if (path.includes("\\")) return "\\";
            else return "/";
        }

        public constructor (path : string, t : PathType = PathType.FileWithExtension) {
            // Find separator
            let sep = this.getSeparator(path);
            this.directories = path.split(sep);

            this.pathType = t;

            if (this.directories[this.directories.length - 1] === "") {
                // Path finished with "/"
                this.pathType = PathType.Directory;
            }
            else if (this.pathType === PathType.Directory) {
                // If is directory but didn't finish with "/", put it
                this.directories.push("");
            }
            else if (this.pathType === PathType.FileWithExtension) {
                let last = this.directories.pop();
                if (last) {
                    let file = last.split(".");
                    this.filename = file[0];
                    this.fileExtension = file[1];
                }
                else {
                    this.directories = [""];
                    this.pathType = PathType.Directory;
                }
            }
            else if (this.pathType === PathType.FileWithoutExtension) {
                let last = this.directories.pop();
                if (last) {
                    this.filename = last;
                }
                else {
                    this.directories = [""];
                    this.pathType = PathType.Directory;
                }
            }
        }
    }
}

export default Assets;