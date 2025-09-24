import * as pulumi from "@pulumi/pulumi";
import { Config, VmDeploymentOutputs } from "./types";
export declare class MultiCloudVM extends pulumi.ComponentResource {
    readonly outputs: VmDeploymentOutputs;
    constructor(name: string, config: Config, opts?: pulumi.ComponentResourceOptions);
}
