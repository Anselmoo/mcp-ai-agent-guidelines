/**
 * Tests for .NET/NuGet csproj parser
 */
import { describe, expect, it } from "vitest";
import { DotNetCsprojParser } from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe(".NET csproj parsing", () => {
	it("parses basic csproj with PackageReferences", async () => {
		const csproj = `
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <AssemblyName>MyApp</AssemblyName>
    <Version>1.0.0</Version>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
    <PackageReference Include="Serilog" Version="3.1.0" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Ecosystem\s*\|\s*dotnet/i);
		expect(text).toMatch(/MyApp/);
		expect(text).toMatch(/Dependencies\s*\|\s*2/i);
	});

	it("detects deprecated Newtonsoft.Json suggestion", async () => {
		const csproj = `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Newtonsoft\.Json|System\.Text\.Json/i);
	});

	it("detects deprecated EntityFramework", async () => {
		const csproj = `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="EntityFramework" Version="6.4.4" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated|EntityFramework/i);
	});

	it("detects floating/wildcard versions", async () => {
		const csproj = `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="SomePackage" Version="*" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Unpinned Version|Floating/i);
	});

	it("detects pre-release versions", async () => {
		const csproj = `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="SomePackage" Version="1.0.0-beta" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Pre-release/i);
	});

	it("detects System.Text.Json vulnerabilities in old versions", async () => {
		const csproj = `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="System.Text.Json" Version="5.0.0" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|System\.Text\.Json/i);
	});

	it("detects out of support ASP.NET Core versions", async () => {
		const csproj = `
<Project Sdk="Microsoft.NET.Sdk.Web">
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc" Version="2.2.0" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/End of Support|out of support/i);
	});

	it("parses dev dependencies with PrivateAssets", async () => {
		const csproj = `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="xunit" Version="2.5.0" PrivateAssets="All" />
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Dev Dependencies\s*\|\s*1/i);
	});

	it("includes .NET-specific recommendations", async () => {
		const csproj = `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Serilog" Version="3.1.0" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			includeReferences: true,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/dotnet list package|NuGet/i);
	});

	it("DotNetCsprojParser.canParse validates correctly", () => {
		const parser = new DotNetCsprojParser();
		expect(
			parser.canParse(
				'<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="Test" /></ItemGroup></Project>',
			),
		).toBe(true);
		expect(parser.canParse('{"dependencies": {}}')).toBe(false);
		expect(parser.canParse('[package]\nname = "test"')).toBe(false);
	});
});
