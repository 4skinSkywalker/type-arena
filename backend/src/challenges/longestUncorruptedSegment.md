## Challenge Description

When migrating data from a source storage system to a target storage system, the number one focus is avoiding data corruption at all costs. In order to meet these high standards, various rounds of tests are run checking for corrupted blocks as well as successfully migrated lengthy regions.

We are tasked to represent the source storage system and target storage system as sequential arrays `sourceArray` and `destinationArray` respectively, where `sourceArray[i]` represents binary data of the `ith` source block as an integer, and `destinationArray[i]` represents binary data of the `ith` destination block, where the data should be migrated, also as an integer. 

Given the content of the source and the migrated content of the target, find the length and the starting block of the longest uncorrupted data segment (segment = subsequent blocks).

If there is no uncorrupted segment, return an array containing 0 and 0 respectively. If there are multiple longest uncorrupted segments, return the one with the minimum value of its left border (the one that's present earlier in the source array).

### Example 

For `sourceArray = [33531593, 96933415, 28506400, 39457872, 29684716, 86010806]` and `destinationArray = [33531593, 96913415, 28506400, 39457872, 29684716, 86010806]`, the output should be
`solution(sourceArray, destinationArray) = [4, 2]`.

The only corrupted element is located by index 1, where `sourceArray[1] = 96933415 != 96913415 = destinationArray[1]`, all other data blocks were transferred uncorrupted. So the longest uncorrupted segment starts on the second index and goes to the end of the array, thus having length 4.