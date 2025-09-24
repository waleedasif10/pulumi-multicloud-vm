"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiCloudVM = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
const azure = __importStar(require("@pulumi/azure-native"));
class MultiCloudVM extends pulumi.ComponentResource {
    constructor(name, config, opts) {
        super("examples:MultiCloudVM", name, {}, opts);
        //
        // ---- Azure Deployment ----
        //
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
            ].filter(Boolean),
        }, { parent: this });
        const nic = new azure.network.NetworkInterface(`${name}-nic`, {
            resourceGroupName: resourceGroup.name,
            ipConfigurations: [{
                    name: "ipconfig1",
                    subnet: { id: pulumi.interpolate `${vnet.id}/subnets/default` },
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
        //
        // ---- AWS Deployment ----
        //
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
            ].filter(Boolean),
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
exports.MultiCloudVM = MultiCloudVM;
//# sourceMappingURL=multicloud.js.map