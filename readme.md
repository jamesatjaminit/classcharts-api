# Classcharts API

A API client for Classcharts

* [Documentation](https://jamesatjaminit.github.io/classcharts-api/index.html)  
* [Discord Server](https://discord.gg/985yaqxPuy)
# Examples
### Documentation is very much WIP, better documentation is planned :D
For any help with the lib, please join the discord!
```typescript
import { ClasschartsClient } from "classcharts-api";
async function main() {
  const client = new ClasschartsClient("classchartsCode", "01/1/2000");
  await client.init();
  console.log(
    await client.getBehaviour({
      // Note: dates are in the American format
      from: "2020-12-23",
      to: "2022-03-09",
    })
  );
  console.log(await client.getActivity());
  console.log(await client.getStudentInfo());
  console.log(await client.getActivity());
  console.log(await client.getActivity());
}

main();
```
