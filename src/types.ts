import * as pulumi from "@pulumi/pulumi";

export interface Config {
    name: pulumi.Input<string>;
    aws: {
        region: pulumi.Input<string>;
        instanceType: pulumi.Input<string>;
        ami: pulumi.Input<string>;
        keyName?: pulumi.Input<string>;
        allowssh: boolean;
        allowhttp: boolean;
    };
    azure: {
        location: pulumi.Input<string>;
        vmSize: pulumi.Input<string>;
        adminUsername: pulumi.Input<string>;
        adminPassword: pulumi.Input<string>;
        allowssh: boolean;
        allowhttp: boolean;
        imagePublisher: pulumi.Input<string>;
        imageOffer: pulumi.Input<string>;
        imageSku: pulumi.Input<string>;
        imageVersion: pulumi.Input<string>;
    };
}

export interface VmDeploymentOutputs {
    aws: {
        instanceId: pulumi.Output<string>;
        publicIp: pulumi.Output<string | undefined>;
    };
    azure: {
        vmId: pulumi.Output<string>;
        publicIp: pulumi.Output<string | undefined>;
    };
}