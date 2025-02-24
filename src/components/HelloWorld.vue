<script >
export default {
    props: {
        msg: {
            type: String,
        }
    },
    data: function() {
        return {
            count: 0
        }
    }
}
</script>

<template>
    <div class="container">
        238910 - {{ count }}
        <hr />
        {{ msg }}
    </div> 
</template>