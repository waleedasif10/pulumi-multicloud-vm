import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as azure from "@pulumi/azure-native";
import { Config, VmDeploymentOutputs } from "./types";

export class MultiCloudVM extends pulumi.ComponentResource {
    public readonly outputs: VmDeploymentOutputs;

    constructor(name: string, config: Config, opts?: pulumi.ComponentResourceOptions) {
        super("examples:MultiCloudVM", name, {}, opts);

        // Azure
        const resourceGroup = new azure.resources.ResourceGroup(`${name}-rg`, {
            location: config.azure.location,
        }, { parent: this });

        const vnet = new azure.network.VirtualNetwork(`${name}-vnet`, {
            resourceGroupName: resourceGroup.name,
            addressSpace: { 
                addressPrefixes: ["10.0.0.0/16"] 
            },
            subnets: [{ 
                name: "default", addressPrefix: "10.0.0.0/24" 
            }],
        }, { parent: this });

        const publicIp = new azure.network.PublicIPAddress(`${name}-pip`, {
            resourceGroupName: resourceGroup.name,
            publicIPAllocationMethod: "Dynamic",
        }, { parent: this });

        const nsg = new azure.network.NetworkSecurityGroup(`${name}-nsg`, {
            resourceGroupName: resourceGroup.name,
            securityRules: [
                config.azure.allowssh && {
                    name: "SSH",
                    priority: 1001,
                    direction: "Inbound",
                    access: "Allow",
                    protocol: "Tcp",
                    sourcePortRange: "*",
                    destinationPortRange: "22",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "*",
                },
                config.azure.allowhttp && {
                    name: "HTTP",
                    priority: 1002,
                    direction: "Inbound",
                    access: "Allow",
                    protocol: "Tcp",
                    sourcePortRange: "*",
                    destinationPortRange: "80",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "*",
                },
            ].filter(Boolean) as azure.types.input.network.SecurityRuleArgs[],
        }, { parent: this });

        const nic = new azure.network.NetworkInterface(`${name}-nic`, {
            resourceGroupName: resourceGroup.name,
            ipConfigurations: [{
                name: "ipconfig1",
                subnet: { id: pulumi.interpolate`${vnet.id}/subnets/default` },
                privateIPAllocationMethod: "Dynamic",
                publicIPAddress: { id: publicIp.id },
            }],
            networkSecurityGroup: { id: nsg.id },
        }, { parent: this });

        const vm = new azure.compute.VirtualMachine(`${name}-vm`, {
            resourceGroupName: resourceGroup.name,
            vmName: `${name}-az-vm`,
            hardwareProfile: { vmSize: config.azure.vmSize },
            networkProfile: {
                networkInterfaces: [{ id: nic.id, primary: true }],
            },
            osProfile: {
                computerName: `${name}-az-vm`,
                adminUsername: config.azure.adminUsername,
                adminPassword: config.azure.adminPassword,
            },
            storageProfile: {
                osDisk: { createOption: "FromImage", name: `${name}-osdisk` },
                imageReference: {
                    publisher: config.azure.imagePublisher,
                    offer: config.azure.imageOffer,
                    sku: config.azure.imageSku,
                    version: config.azure.imageVersion,
                },
            },
        }, { parent: this });

        // AWS
        const vpc = new aws.ec2.Vpc(`${name}-vpc`, {
            cidrBlock: "10.0.0.0/16",
        }, { parent: this });

        const subnet = new aws.ec2.Subnet(`${name}-subnet`, {
            vpcId: vpc.id,
            cidrBlock: "10.0.0.0/24",
            availabilityZone: `${config.aws.region}a`,
            mapPublicIpOnLaunch: true,
        }, { parent: this });

        const securityGroup = new aws.ec2.SecurityGroup(`${name}-sg`, {
            vpcId: vpc.id,
            description: "Allow inbound traffic",
            ingress: [
                config.aws.allowssh && {
                    protocol: "tcp",
                    fromPort: 22,
                    toPort: 22,
                    cidrBlocks: ["0.0.0.0/0"],
                },
                config.aws.allowhttp && {
                    protocol: "tcp",
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ["0.0.0.0/0"],
                },
            ].filter(Boolean) as aws.types.input.ec2.SecurityGroupIngress[],
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
            }],
        }, { parent: this });

        const ec2Instance = new aws.ec2.Instance(`${name}-ec2`, {
            ami: config.aws.ami,
            instanceType: config.aws.instanceType,
            subnetId: subnet.id,
            vpcSecurityGroupIds: [securityGroup.id],
        }, { parent: this });

        this.outputs = {
            azure: {
                vmId: vm.id,
                publicIp: publicIp.ipAddress,
            },
            aws: {
                instanceId: ec2Instance.id,
                publicIp: ec2Instance.publicIp,
            },
        };

        this.registerOutputs(this.outputs);
    }
}
